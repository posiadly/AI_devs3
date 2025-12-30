export interface Answer {
  code: number;
  message: string;
}

export interface Message {
  task: string;
  apikey: string;
  answer: any;
}
