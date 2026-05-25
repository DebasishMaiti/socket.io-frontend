export const validEmail = new RegExp('^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$');
export const validPassword = new RegExp('^(?=.*?[A-Za-z])(?=.*?[0-9]).{6,}$');
export const validAadhar = new RegExp('/^[0-9]{4}[ -]?[0-9]{4}[ -]?[0-9]{4}$/,');
export const validPan = new RegExp('/^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/');
export const validPhone = new RegExp('/^[6-9]\d{9}$/');