export function extractFlag(text: string): string | undefined {
  const flag = text.match(/{{FLG:([^}]+)}}/);
  return flag ? flag[1] : undefined;
}
