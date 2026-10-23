import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";

import { SymbolView } from "../../components/ui/AppSymbol";
import { AppText as Text } from "../../components/ui/AppText";

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
 * The /btw result, docked above the composer. It mirrors the web panel: the
 * transcript gains nothing, and dismissing it throws the exchanges away.
 */
export function ComposerSideQuestion({
  state,
  onAsk,
  onClose,
}: {
  readonly state: SideQuestionPanelState;
  readonly onAsk: (question: string) => void;
  readonly onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const question = draft.trim();
    if (question.length === 0 || state.pending) return;
    setDraft("");
    onAsk(question);
  };
  return (
    <View className="overflow-hidden rounded-[20px] border-continuous bg-card">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
        <Text className="font-medium text-foreground" numberOfLines={1}>
          Side question
        </Text>
        <Pressable
          accessibilityLabel="Dismiss side question"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          className="-me-1 p-1 active:opacity-60"
        >
          <SymbolView
            name="xmark"
            size={14}
            tintColorClassName="accent-icon-muted"
            type="monochrome"
          />
        </Pressable>
      </View>
      <ScrollView bounces={false} className="max-h-72" contentContainerClassName="gap-3 px-4 pb-2">
        <Text className="text-xs text-muted-foreground">Answers here stay out of the thread.</Text>
        {state.exchanges.map((exchange) => (
          <View key={exchange.id} className="gap-1">
            <Text className="text-xs font-medium text-foreground">{exchange.question}</Text>
            {exchange.answer === null ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-xs text-muted-foreground">Thinking…</Text>
              </View>
            ) : (
              <View>
                <Text className="text-sm text-foreground" selectable>
                  {exchange.answer}
                </Text>
                {exchange.synthetic ? (
                  <Text className="text-xs text-muted-foreground">
                    Answered without the session's own model.
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        ))}
        {state.error === null ? null : (
          <Text className="text-xs text-destructive">{state.error}</Text>
        )}
      </ScrollView>
      <View className="flex-row items-center gap-2 border-t border-separator px-4 py-2">
        <TextInput
          accessibilityLabel="Side question"
          className="min-w-0 flex-1 text-sm text-foreground"
          placeholder="Ask a side question"
          placeholderTextColorClassName="accent-icon-muted"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          editable={!state.pending}
          returnKeyType="send"
        />
        <Pressable
          accessibilityLabel="Ask side question"
          accessibilityRole="button"
          disabled={state.pending || draft.trim().length === 0}
          onPress={submit}
          className="rounded-full bg-primary px-3 py-1.5 active:opacity-70 disabled:opacity-40"
        >
          <Text className="text-xs font-medium text-primary-foreground">Ask</Text>
        </Pressable>
      </View>
    </View>
  );
}
