export function onlyDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function repeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

export function isValidCpf(value: unknown) {
  const cpf = onlyDigits(value);
  if (!/^\d{11}$/.test(cpf) || repeatedDigits(cpf)) return false;

  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function isValidCnpj(value: unknown) {
  const cnpj = onlyDigits(value);
  if (!/^\d{14}$/.test(cnpj) || repeatedDigits(cnpj)) return false;

  const calc = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((acc, item, index) => acc + Number(item) * weights[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(
    cnpj.slice(0, 12) + String(d1),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

export function isValidTaxId(value: unknown) {
  return isValidCpf(value) || isValidCnpj(value);
}

export function isValidBrazilPhone(value: unknown) {
  const phone = onlyDigits(value);
  return /^\d{10,11}$/.test(phone);
}

export function isValidCep(value: unknown) {
  return /^\d{8}$/.test(onlyDigits(value));
}
