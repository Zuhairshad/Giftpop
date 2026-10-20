/** Strip what a field can never hold, as the customer types or pastes. */

/** Letters (any script), marks, spaces and . ' - (names, cities, regions). */
export function nameText(value: string): string {
  return value.replace(/[^\p{L}\p{M} .'’-]/gu, "");
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Letters, digits, space and hyphen (UK and CA postcodes mix letters and digits). */
export function postalCodeText(value: string): string {
  return value.replace(/[^\p{L}\p{N} -]/gu, "");
}

/** Letters, digits, space and , . # / - ' & for street lines. */
export function addressLineText(value: string): string {
  return value.replace(/[^\p{L}\p{M}\p{N} ,.#/'’&-]/gu, "");
}
