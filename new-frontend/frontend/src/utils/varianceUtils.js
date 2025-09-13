export const hasVariance = (data, key) =>{
  const values = data.map(d => parseFloat(d[key])).filter(v => !isNaN(v));
  const unique = new Set(values);
  return unique.size > 1;
};