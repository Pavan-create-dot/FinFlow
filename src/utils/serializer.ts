export const serializePrisma = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
};
