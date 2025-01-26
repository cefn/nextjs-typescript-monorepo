import { sum } from "@myrepo/sum";

export function multiply(a: number, b: number) {
  let total = 0;
  for (let count = 0; count < b; count++) {
    total = sum(total, a);
  }
  return total;
}
