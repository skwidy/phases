function mix(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function dailyTips(tips: readonly string[], seed: number, count = 3): string[] {
  if (tips.length <= count) return [...tips];
  const order = tips.map((_, index) => index);
  const random = mix(seed);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = order[index];
    order[index] = order[swap];
    order[swap] = current;
  }
  return order
    .slice(0, count)
    .sort((left, right) => left - right)
    .map((index) => tips[index]);
}
