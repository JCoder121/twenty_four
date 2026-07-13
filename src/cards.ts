export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export const SUITS = ['♠', '♥', '♦', '♣'] as const

export type Rank = (typeof RANKS)[number]
export type Suit = (typeof SUITS)[number]

export interface Card {
  rank: Rank
  suit: Suit
}

export function valueOf(card: Card): number {
  return RANKS.indexOf(card.rank) + 1
}

export function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`
}

export function formatHand(cards: Card[]): string {
  return cards.map(formatCard).join(' ')
}
