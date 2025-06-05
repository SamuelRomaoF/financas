export const getBankInitials = (bankName: string): string => {
  if (!bankName) return '??';
  const words = bankName.split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
}; 