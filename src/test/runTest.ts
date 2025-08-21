import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
	// 创建Mocha测试套件
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 10000
	});

	const testsRoot = path.resolve(__dirname, '.');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot })
			.then((files: string[]) => {
				// 添加测试文件到测试套件
				files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

				try {
					// 运行Mocha测试
					mocha.run(failures => {
						if (failures > 0) {
							e(new Error(`${failures} tests failed.`));
						} else {
							c();
						}
					});
				} catch (err) {
					console.error(err);
					e(err);
				}
			})
			.catch(e);
	});
}
