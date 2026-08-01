export const CAR_BRANDS = [
  "Abarth","Alfa Romeo","Alpine","Aston Martin","Audi",
  "Bentley","BMW","Bugatti","Buick","BYD",
  "Cadillac","Chevrolet","Chrysler","Citroën","Cupra",
  "Dacia","Daewoo","Daihatsu","Dodge","DS",
  "Ferrari","Fiat","Fisker","Ford",
  "Genesis","GMC","Great Wall",
  "Honda","Hummer","Hyundai",
  "Infiniti","Isuzu","Iveco",
  "Jaguar","Jeep",
  "Kia","Koenigsegg",
  "Lada","Lamborghini","Lancia","Land Rover","Lexus","Lincoln","Lotus","Lucid",
  "Mahindra","Maserati","Maybach","Mazda","McLaren","Mercedes-Benz","MG","Mini","Mitsubishi","Morgan",
  "Nio","Nissan",
  "Opel",
  "Pagani","Peugeot","Polestar","Pontiac","Porsche","Proton",
  "Renault","Rimac","Rivian","Rolls-Royce","Rover",
  "Saab","Seat","Škoda","Smart","SsangYong","Subaru","Suzuki",
  "Tesla","Toyota",
  "Vauxhall","Volkswagen","Volvo",
  "Xpeng",
  "Zeekr",
];

export function suggestBrands(query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = CAR_BRANDS.filter((b) => b.toLowerCase().startsWith(q));
  const contains = CAR_BRANDS.filter(
    (b) => !b.toLowerCase().startsWith(q) && b.toLowerCase().includes(q),
  );
  return [...starts, ...contains].slice(0, limit);
}
