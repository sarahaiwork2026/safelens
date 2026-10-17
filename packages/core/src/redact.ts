export function redact(s: string) {
  return s
    .replace(/\b\d{5}-?\d{7}-?\d\b/g, "[id removed]")
    .replace(/(?:\+92|0092|\b0)[\s-]?3\d{2}[\s-]?\d{7}\b/g, "[phone removed]")
    .replace(/\b(?:\+92[\s-]?21|021)[\s-]?\d{7,8}\b/g, "[phone removed]");
}
