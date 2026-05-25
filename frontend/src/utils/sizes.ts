// EU sizes as base — conversion to US Men, US Women, UK
type SizeRow = { usM: string; usW: string; uk: string };

const TABLE: Record<string, SizeRow> = {
  '35':   { usM: '3.5', usW: '5',    uk: '3'   },
  '35.5': { usM: '4',   usW: '5.5',  uk: '3.5' },
  '36':   { usM: '4',   usW: '5.5',  uk: '3.5' },
  '36.5': { usM: '4.5', usW: '6',    uk: '4'   },
  '37':   { usM: '5',   usW: '6.5',  uk: '4.5' },
  '37.5': { usM: '5.5', usW: '7',    uk: '5'   },
  '38':   { usM: '6',   usW: '7.5',  uk: '5.5' },
  '38.5': { usM: '6.5', usW: '8',    uk: '6'   },
  '39':   { usM: '7',   usW: '8.5',  uk: '6.5' },
  '40':   { usM: '7.5', usW: '9',    uk: '7'   },
  '40.5': { usM: '8',   usW: '9.5',  uk: '7.5' },
  '41':   { usM: '8.5', usW: '10',   uk: '8'   },
  '42':   { usM: '9',   usW: '10.5', uk: '8.5' },
  '42.5': { usM: '9.5', usW: '11',   uk: '9'   },
  '43':   { usM: '10',  usW: '11.5', uk: '9.5' },
  '44':   { usM: '10.5',usW: '12',   uk: '10'  },
  '44.5': { usM: '11',  usW: '12.5', uk: '10.5'},
  '45':   { usM: '11.5',usW: '13',   uk: '11'  },
  '45.5': { usM: '12',  usW: '13.5', uk: '11.5'},
  '46':   { usM: '12.5',usW: '14',   uk: '12'  },
  '47':   { usM: '13',  usW: '14.5', uk: '12.5'},
};

export type SizeSystem = 'EU' | 'US' | 'UK';

export function convertSize(eu: string | number, system: SizeSystem, gender: string): string {
  if (system === 'EU') return String(eu);
  const row = TABLE[String(eu)];
  if (!row) return String(eu);
  if (system === 'UK') return row.uk;
  return gender === 'female' ? row.usW : row.usM;
}

export function euToAll(eu: string | number, gender: string): string {
  const row = TABLE[String(eu)];
  if (!row) return `EU ${eu}`;
  const us = gender === 'female' ? row.usW : row.usM;
  return `EU ${eu} / US ${us} / UK ${row.uk}`;
}
