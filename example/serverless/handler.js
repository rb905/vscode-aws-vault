module.exports.foo = async (event) => {
  const { str1, str2 } = JSON.parse(event.body || '{}');
  const result = `${str1 || ''}${str2 || ''}`;
  console.log('Concatenated string:', result);
  return {
    statusCode: 200,
    body: JSON.stringify({ result })
  };
};