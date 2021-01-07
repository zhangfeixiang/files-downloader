import fs from 'fs';
import https from 'http';
import path from 'path'
// 下载队列
export class Queue {
    constructor(max = 2) {
        this._list = [];
        this.max = max;
    }

    async push(promise) {
        promise.finally(() => {
            const index = this._list.indexOf(promise);
            this._list.splice(index, 1);
        });

        this._list.push(promise);
        if (this._list.length >= this.max) await Promise.race([...this._list]);
        return Promise.resolve();
    }
    async finish() {
        return await Promise.all(this._list), Promise.resolve();
    }
}

/**
* 根据url结构创建文件夹
* @param basePath rquired 输出文件夹根目录
* @param pathStr 图片网址
* @return path 返回绝对路径
*/
export function createFolders(basePath, pathStr, { needEmpty } = { needEmpty: false }) {
    if (!basePath) {
        console.error('basePath cannot be empty')
        return
    };

    // http://xxx.xxx.com/xxx/xxx/xxx/filename.png
    let dirs = pathStr.split('/').slice(3, -1)
    let currentPath = basePath
    dirs
        .forEach(dir => {
            // 如果路径包含 xx//x.png 空目录转为null
            if (dir === '') dir = 'null';
            currentPath = path.join(currentPath, dir)
            // 当前目录不存在
            if (!fs.existsSync(currentPath)) {
                fs.mkdirSync(currentPath);
                return;
            }
            var tempstats = fs.statSync(currentPath);
            // 文件目录不为空且需要清空
            if (!(tempstats.isDirectory()) && needEmpty) {
                fs.unlinkSync(currentPath);
                fs.mkdirSync(currentPath);
            }
        })
    return currentPath;
}


/**
 * 下载文件
 * @param {*} param0 { url: string; path: string }
 * @param {*} cb {progress: int; type: 'upload' | 'compress' | 'download' }
 */
export function download({ url, path }, cb = (op) => { }) {
    return new Promise((resolove, reject) => {
        cb({ progress: 0, type: 'download' });
        const req = https.request(url, res => {
            const size = Number(res.headers['content-length']);
            let buffs = '';
            res.setEncoding('binary');
            res.on('data', buf => {
                buffs += buf;
                cb({ progress: buffs.length / size, type: 'download' });
            });
            res.on('end', () => {
                const { statusCode = 0 } = res;
                if (statusCode >= 200 && statusCode < 400) {
                    fs.writeFile(path, buffs, 'binary', err => (err ? reject(err) : resolove()));
                } else {
                    cb({ progress: 0, type: 'download' });
                    reject(new Error(buffs));
                }
            });
            res.on('error', (er) => {
                reject(er)
            });
        });
        req.on('error', reject);
        req.end();
    });
}


function calcProgress({ type, progress }) {
    let p = 0;
    if (type === 'upload') {
        p = progress * 0.33;
    } else if (type === 'compress') {
        p = progress * 0.33 + 0.33;
    } else {
        p = progress * 0.34 + 0.66;
    }

    const status = p < 1 ? ['下载图片中'] : ['下载完成'];

    console.log('status: ', ...status);
    console.log(p);
    const result = {
        progress: p,
        status
    };
    return result;
}


export async function downloader({ img, basePath, path: _path }, cb = (op) => { }) {
    return new Promise(async (reslove, reject) => {
        // const up = await upload(img, p => cb(calcProgress(p))).catch(error => (cb(calcProgress({ progress: 0, type: 'upload' })), error));
        // console.log('up: ', up);
        // if (up instanceof Error) return reject({ type: 'upload', error: up });
        const down = await download({ url: img, path: path.join(basePath, _path) }, p => cb(calcProgress(p))).catch(error => (cb(calcProgress({ progress: 0.66, type: 'download' })), error));

        if (down instanceof Error) return reject({ type: 'download', error: down, url: img });
        reslove(down);
    });
}

export function getFilename(img) {
    if (!img) return '';
    return img.split('/').slice(-1)[0]
}