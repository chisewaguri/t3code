export interface SideQuestionExchange {
  readonly id: string;
  readonly question: string;
  readonly answer: string | null;
  readonly synthetic?: boolean;
}

export interface SideQuestionPanelState {
  readonly id: string;
  readonly threadKey: string;
  readonly focusKey: number;
  readonly exchanges: ReadonlyArray<SideQuestionExchange>;
  readonly pending: boolean;
  readonly error: string | null;
}

export function beginSideQuestion(
  current: SideQuestionPanelState | null,
  threadKey: string,
  id: string,
  question: string,
): SideQuestionPanelState | null {
  if (question.length === 0) {
    return current?.threadKey === threadKey
      ? { ...current, focusKey: current.focusKey + 1 }
      : { id, threadKey, focusKey: 0, exchanges: [], pending: false, error: null };
  }
  if (current?.threadKey === threadKey && current.pending) return null;
  return {
    id: current?.threadKey === threadKey ? current.id : id,
    threadKey,
    focusKey: current?.threadKey === threadKey ? current.focusKey : 0,
    exchanges: [
      ...(current?.threadKey === threadKey ? current.exchanges : []),
      { id, question, answer: null },
    ],
    pending: true,
    error: null,
  };
}

export function finishSideQuestion(
  current: SideQuestionPanelState | null,
  id: string,
  result: { readonly answer: string; readonly synthetic?: boolean } | { readonly error: string },
): SideQuestionPanelState | null {
  if (!current?.pending || current.exchanges.at(-1)?.id !== id) return current;
  return {
    ...current,
    pending: false,
    error: "error" in result ? result.error : null,
    exchanges: current.exchanges.map((exchange) =>
      exchange.id !== id || "error" in result ? exchange : { ...exchange, ...result },
    ),
  };
}
