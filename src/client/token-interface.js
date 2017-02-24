let TOKEN_MEMORY_STORAGE = '';

module.exports = {
	get: () => TOKEN_MEMORY_STORAGE,
	set: (value) => TOKEN_MEMORY_STORAGE = value
};