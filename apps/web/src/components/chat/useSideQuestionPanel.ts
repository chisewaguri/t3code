import type { EnvironmentId, ServerProvider, ThreadId } from "@t3tools/contracts";
import { SIDE_QUESTION_COMMAND } from "@t3tools/shared/sideQuestion";
import { useState } from "react";
import { useStableCallback } from "../../hooks/useStableCallback";
import { squashAtomCommandFailure } from "@t3tools/client-runtime/state/runtime";
import type * as Cause from "effect/Cause";
import { newMessageId } from "~/lib/utils";
import {
  sideQuestionBannerItem,
  type SideQuestionExchange,
  type SideQuestionPanelState,
} from "./ComposerSideQuestion";

/**
 * The /btw panel for one thread: a question answered outside the transcript.
 * It closes on a thread change and keeps its exchanges in memory only, so a
 * reload starts clean, the way the CLI's own side question does.
 */
export function useSideQuestionPanel(input: {
  readonly environmentId: EnvironmentId;
  readonly threadId: ThreadId | null;
  readonly threadKey: string;
  readonly providerSlashCommands: ServerProvider["slashCommands"] | null;
  readonly cwd: string | null;
  readonly ask: (input: {
    readonly environmentId: EnvironmentId;
    readonly input: {
      readonly threadId: ThreadId;
      readonly question: string;
      readonly history?: ReadonlyArray<{ readonly question: string; readonly response: string }>;
    };
  }) => Promise<
    | {
        readonly _tag: "Success";
        readonly value: { readonly answer: string; readonly synthetic?: boolean };
      }
    | { readonly _tag: "Failure"; readonly cause: Cause.Cause<unknown> }
  >;
}) {
  const { environmentId, threadId, threadKey, providerSlashCommands, cwd, ask } = input;
  const [panel, setPanel] = useState<SideQuestionPanelState | null>(null);
  if (panel !== null && panel.threadKey !== threadKey) {
    setPanel(null);
  }
  const offered =
    providerSlashCommands !== null &&
    providerSlashCommands.some((command) => command.name === SIDE_QUESTION_COMMAND.name);

  const open = useStableCallback(() =>
    setPanel((current) =>
      current === null || current.threadKey !== threadKey
        ? { threadKey, exchanges: [], pending: false, error: null }
        : current,
    ),
  );

  const askFromPanel = useStableCallback(async (question: string) => {
    const asked = question.trim();
    if (threadId === null) return;
    if (asked.length === 0) {
      // Picked from the menu with nothing typed yet: open and wait.
      setPanel((current) =>
        current === null || current.threadKey !== threadKey
          ? { threadKey, exchanges: [], pending: false, error: null }
          : current,
      );
      return;
    }
    const settled = (panel?.exchanges ?? []).filter(
      (exchange): exchange is SideQuestionExchange & { answer: string } => exchange.answer !== null,
    );
    const askedId = newMessageId();
    setPanel({
      threadKey,
      exchanges: [...settled, { id: askedId, question: asked, answer: null }],
      pending: true,
      error: null,
    });
    const result = await ask({
      environmentId,
      input: {
        threadId,
        question: asked,
        ...(settled.length === 0
          ? {}
          : {
              history: settled.map((exchange) => ({
                question: exchange.question,
                response: exchange.answer,
              })),
            }),
      },
    });
    setPanel((current) => {
      // A thread switch or a newer ask owns the panel now.
      if (current === null || current.threadKey !== threadKey) return current;
      const answered = current.exchanges.filter((exchange) => exchange.answer !== null);
      if (result._tag === "Failure") {
        const error = squashAtomCommandFailure(result);
        return {
          ...current,
          pending: false,
          exchanges: answered,
          error: error instanceof Error ? error.message : "The side question failed.",
        };
      }
      return {
        ...current,
        pending: false,
        error: null,
        exchanges: [
          ...answered,
          {
            id: askedId,
            question: asked,
            answer: result.value.answer,
            ...(result.value.synthetic === true ? { synthetic: true } : {}),
          },
        ],
      };
    });
  });

  const banner =
    panel === null
      ? null
      : sideQuestionBannerItem({
          // One id per thread keeps the panel open across exchanges; dismissing closes it.
          id: `side-question:${panel.threadKey}`,
          state: panel,
          environmentId,
          cwd: cwd ?? undefined,
          onAsk: (question) => void askFromPanel(question),
          onDismiss: () => setPanel(null),
        });

  return { banner, offered, open, ask: askFromPanel };
}
