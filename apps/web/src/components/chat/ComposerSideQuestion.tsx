import type { EnvironmentId } from "@t3tools/contracts";
import { LoaderCircleIcon, MessagesSquareIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "../ui/button";
import { ComposerBanner } from "./ComposerBanner";
import type { ComposerBannerStackItem } from "./ComposerBannerStack";
import ChatMarkdown from "../ChatMarkdown";

export interface SideQuestionExchange {
  /** Stable per ask, so two identical questions still key apart. */
  readonly id: string;
  readonly question: string;
  readonly answer: string | null;
  readonly synthetic?: boolean;
}

export interface SideQuestionPanelState {
  readonly threadKey: string;
  readonly exchanges: ReadonlyArray<SideQuestionExchange>;
  readonly pending: boolean;
  readonly error: string | null;
}

/**
 * The `/btw` answer surface. It sits over the transcript like a notice, so the
 * thread keeps its scroll position and its transcript gains nothing.
 */
export function sideQuestionBannerItem(input: {
  readonly id: string;
  readonly state: SideQuestionPanelState;
  readonly environmentId: EnvironmentId;
  readonly cwd: string | undefined;
  readonly onAsk: (question: string) => void;
  readonly onDismiss: () => void;
}): ComposerBannerStackItem {
  const { state } = input;
  return {
    id: input.id,
    variant: state.error === null ? "info" : "error",
    priority: "notice",
    icon: <MessagesSquareIcon />,
    title: "Side question",
    description: "Answers here stay out of the thread.",
    dismissLabel: "Dismiss side question",
    onDismiss: input.onDismiss,
    children: (
      <ComposerBanner.Scroll>
        <ComposerBanner.Body className="flex flex-col gap-2 pt-1 pb-1.5 pe-2">
          {state.exchanges.length === 0 ? null : (
            <ol className="flex flex-col gap-3">
              {state.exchanges.map((exchange) => (
                <li key={exchange.id} className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-medium text-foreground">{exchange.question}</span>
                  {exchange.answer === null ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LoaderCircleIcon className="size-3 animate-spin" />
                      Thinking…
                    </span>
                  ) : (
                    <div className="text-sm">
                      <ChatMarkdown
                        text={exchange.answer}
                        cwd={input.cwd}
                        environmentId={input.environmentId}
                      />
                      {exchange.synthetic ? (
                        <span className="text-xs text-muted-foreground">
                          Answered without the session's own model.
                        </span>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
          {state.error === null ? null : (
            <span className="text-xs text-destructive">{state.error}</span>
          )}
          <SideQuestionInput disabled={state.pending} onAsk={input.onAsk} />
        </ComposerBanner.Body>
      </ComposerBanner.Scroll>
    ),
  };
}

function SideQuestionInput(props: {
  readonly disabled: boolean;
  readonly onAsk: (question: string) => void;
}) {
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = value.trim();
    if (question.length === 0 || props.disabled) return;
    setValue("");
    props.onAsk(question);
  };
  return (
    <form className="flex min-w-0 items-center gap-2" onSubmit={submit}>
      <input
        aria-label="Side question"
        className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
        placeholder="Ask a side question"
        spellCheck={false}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={props.disabled}
      />
      <Button
        size="xs"
        type="submit"
        variant="secondary"
        disabled={props.disabled || !value.trim()}
      >
        Ask
      </Button>
    </form>
  );
}
