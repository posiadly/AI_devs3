export interface TestData {
  question: string;
  answer: number;
  test?: Test;
}

export interface Test {
  q: string;
  a: string;
}
