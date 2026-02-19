/**
 * Formats a French phone number into groups of two digits separated by thin non-breaking spaces (06 12 34 56 78 for example).
 * Handles various input formats including international and local.
 * @param phone - The input phone number as a string.
 * @returns The formatted phone number or an empty string if invalid.
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) {
    return "";
  }

  const thinNbsp = "\u202F";
  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) {
    return "";
  }

  let nationalNumber = cleaned;

  if (cleaned.startsWith("33") && cleaned.length === 11) {
    nationalNumber = "0" + cleaned.slice(2);
  } else if (
    phone.startsWith("+") &&
    cleaned.startsWith("33") &&
    cleaned.length >= 11
  ) {
    nationalNumber = "0" + cleaned.slice(2);
  } else if (cleaned.length === 9) {
    nationalNumber = "0" + cleaned;
  }

  const formatNational = (num: string) => {
    if (num.length === 10) {
      return num.replace(
        /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        `$1${thinNbsp}$2${thinNbsp}$3${thinNbsp}$4${thinNbsp}$5`
      );
    } else {
      return num.replace(/(\d{2})/g, `$1${thinNbsp}`).trim();
    }
  };

  return formatNational(nationalNumber);
};
