module.exports = function (api) {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			[
				'module-resolver',
				{
					root: ['./src'],
					extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
					alias: {
						'@': './src',
						'@/components': './src/components',
						'@/services': './src/services',
						'@/utils': './src/utils',
						'@/styles': './src/styles',
						'@/types': './src/types',
						'@/hooks': './src/hooks',
						'@/auth': './src/auth',
						'@/screens': './src/screens',
					},
				},
			],
		],
	};
};
