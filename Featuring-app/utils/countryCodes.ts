export const hispanicCountryCodes = {
  "Argentina": "+54",
  "Bolivia": "+591",
  "Chile": "+56",
  "Colombia": "+57",
  "Costa Rica": "+506",
  "Cuba": "+53",
  "Ecuador": "+593",
  "El Salvador": "+503",
  "España": "+34",
  "Guatemala": "+502",
  "Honduras": "+504",
  "México": "+52",
  "Nicaragua": "+505",
  "Panamá": "+507",
  "Paraguay": "+595",
  "Perú": "+51",
  "Puerto Rico": "+1",
  "República Dominicana": "+1",
  "Uruguay": "+598",
  "Venezuela": "+58"
};

export const phoneNumberMaxLength = {
  "Argentina": 14, // +54 9 11 1234-5678
  "Bolivia": 12, // +591 12345678
  "Chile": 12, // +56 9 1234 5678
  "Colombia": 13, // +57 321 1234567
  "Costa Rica": 12, // +506 1234 5678
  "Cuba": 11, // +53 5 1234567
  "Ecuador": 13, // +593 99 123 4567
  "El Salvador": 12, // +503 1234 5678
  "España": 12, // +34 612 345 678
  "Guatemala": 12, // +502 1234 5678
  "Honduras": 12, // +504 1234 5678
  "México": 13, // +52 1 55 1234 5678
  "Nicaragua": 12, // +505 1234 5678
  "Panamá": 12, // +507 1234 5678
  "Paraguay": 13, // +595 981 123456
  "Perú": 12, // +51 912 345 678
  "Puerto Rico": 12, // +1 787 123 4567
  "República Dominicana": 12, // +1 809 123 4567
  "Uruguay": 12, // +598 91 234 567
  "Venezuela": 13, // +58 412 1234567
};

export type HispanicCountry = keyof typeof hispanicCountryCodes;
