import { Card } from '../../types';
import { CardDisplay } from './CardDisplay';

interface HandProps {
  hand: Card[];
  selectedCard: Card | null;
  isMyTurn: boolean;
  turnStep: string;
  onSelectCard: (card: Card | null) => void;
}

export function Hand({ hand, selectedCard, isMyTurn, turnStep, onSelectCard }: HandProps) {
  const isActionStep = isMyTurn && turnStep === 'action';

  const handleCardClick = (card: Card) => {
    if (!isActionStep) return;
    if (selectedCard?.id === card.id) {
      onSelectCard(null);
    } else {
      onSelectCard(card);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-amber-900 text-sm">手札</h3>
        <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
          {hand.length} / 4
        </span>
      </div>

      {hand.length === 0 ? (
        <div className="text-center py-6 text-amber-300">
          <div className="text-3xl mb-1">🃏</div>
          <p className="text-xs">手札がありません</p>
          <p className="text-xs">カードを引いてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {hand.map((card) => (
            <CardDisplay
              key={card.id}
              card={card}
              isSelected={selectedCard?.id === card.id}
              isClickable={isActionStep}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {isActionStep && hand.length > 0 && (
        <p className="text-xs text-amber-600 text-center mt-2 font-medium">
          {selectedCard ? 'カードが選択されています' : 'カードをクリックして選択'}
        </p>
      )}
    </div>
  );
}
