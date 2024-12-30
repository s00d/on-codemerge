export interface DiffChange {
  type: 'add' | 'remove' | 'equal';
  value: string;
}

export function computeDiff(oldText: string, newText: string): DiffChange[] {
  const changes: DiffChange[] = [];
  const oldWords = oldText.split(/(\s+|<[^>]+>)/);
  const newWords = newText.split(/(\s+|<[^>]+>)/);

  let i = 0,
    j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      // All remaining words in newWords are additions
      changes.push({ type: 'add', value: newWords[j] });
      j++;
    } else if (j >= newWords.length) {
      // All remaining words in oldWords are removals
      changes.push({ type: 'remove', value: oldWords[i] });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      // Words are equal
      changes.push({ type: 'equal', value: oldWords[i] });
      i++;
      j++;
    } else {
      // Words differ - try to find next match
      let foundMatch = false;
      let lookAhead = 1;
      const maxLookAhead = 3;

      while (lookAhead <= maxLookAhead && !foundMatch) {
        if (i + lookAhead < oldWords.length && oldWords[i + lookAhead] === newWords[j]) {
          // Found match in old text - mark skipped words as removed
          for (let k = 0; k < lookAhead; k++) {
            changes.push({ type: 'remove', value: oldWords[i + k] });
          }
          i += lookAhead;
          foundMatch = true;
        } else if (j + lookAhead < newWords.length && oldWords[i] === newWords[j + lookAhead]) {
          // Found match in new text - mark skipped words as added
          for (let k = 0; k < lookAhead; k++) {
            changes.push({ type: 'add', value: newWords[j + k] });
          }
          j += lookAhead;
          foundMatch = true;
        }
        lookAhead++;
      }

      if (!foundMatch) {
        // No match found - mark as remove and add
        changes.push({ type: 'remove', value: oldWords[i] });
        changes.push({ type: 'add', value: newWords[j] });
        i++;
        j++;
      }
    }
  }

  return changes;
}
