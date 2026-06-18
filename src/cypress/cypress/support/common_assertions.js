export function expectNoBodyErrors(doc) {
  const bodyText = doc.querySelector('body')?.textContent?.toLowerCase() || '';

  const failurePatterns = [
    /\berror:\s/i,
    /\bexception\b/i,
    /\btraceback\b/i,
    /\b404 not found\b/i,
  ];

  const matches = failurePatterns
    .map((pattern) => {
      const match = bodyText.match(pattern);

      if (!match) {
        return null;
      }

      const index = match.index ?? 0;
      const context = bodyText.slice(
        Math.max(0, index - 200),
        Math.min(bodyText.length, index + 500)
      );

      return {
        pattern: pattern.toString(),
        matchedText: match[0],
        context,
      };
    })
    .filter(Boolean);

  const message = matches
    .map(
      ({ pattern, matchedText, context }) =>
        `Pattern: ${pattern}\nMatched: ${matchedText}\nContext:\n${context}`
    )
    .join('\n\n---\n\n');

  expect(
    matches,
    `Found ${matches.length} possible error message(s) in body text:\n\n${message}`
  ).to.have.length(0);
}