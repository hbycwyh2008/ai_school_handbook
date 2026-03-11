const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /reveal\s+(the\s+)?system\s+prompt/i,
    /use\s+your\s+own\s+knowledge/i,
    /forget\s+the\s+handbook/i,
    /act\s+as/i,
    /pretend\s+you\s+are/i
  ];
  
  export function safetyCheck(question = '') {
    const matches = suspiciousPatterns.filter((pattern) => pattern.test(question));
    return {
      suspicious: matches.length > 0,
      reasons: matches.map((regex) => regex.toString())
    };
  }
  