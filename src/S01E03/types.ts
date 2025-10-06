export interface Message {
  task: string;
  apikey: string;
  answer: any;
}
export interface Answer {
  code: number;
  message: string;
}

export interface TestData {
  question: string;
  answer: number;
  test?: Test;
}

export interface Test {
  q: string;
  a: string;
}
