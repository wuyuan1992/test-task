function formatListToMap(list, key = 'id') {
  return list?.reduce((map, item) => Object.assign(map, { [item[key]]: item }), {}) ?? [];
}

module.exports = {
  formatListToMap,
};
