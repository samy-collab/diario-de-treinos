export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string) {
  // O banco guarda AAAA-MM-DD para ordenar; a tela apresenta DD/MM/AAAA.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function currentMonth() {
  // Retorna AAAA-MM, o mesmo prefixo usado no resumo mensal.
  return new Date().toISOString().slice(0, 7);
}
