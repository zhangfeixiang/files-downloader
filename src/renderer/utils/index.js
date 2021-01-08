import fs from 'fs';
import https from 'https';
import http from 'http';
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
    // 根据协议 
    const [protocol] = url.split('://')
    const request = { http, https }
    return new Promise((resolove, reject) => {
        cb({ progress: 0, type: 'download' });
        const req = request[protocol].get(url, res => {
            const size = Number(res.headers['content-length']);
            let buffs = 0;
            // 删除文件，防止被追加进去
            fs.unlinkSync(path);
            let downloadfile = fs.createWriteStream(path, { 'flags': 'a'});
            res.setEncoding('binary');
            res.on('data', buf => {
                buffs += buf.length;
                downloadfile.write(buf, 'binary');
                cb({ progress: buffs / size, type: 'download' });
            });
            res.on('end', () => {
                const { statusCode = 0 } = res;
                if (statusCode >= 200 && statusCode < 400) {
                    if (path.indexOf('?') > -1) {
                        path = path.substr(0, path.indexOf('?'))
                    }
                    console.log('写入文件到：', path)
                    downloadfile.end();
                    // fs.writeFile(path, buffs, 'binary', err => (err ? reject(err) : resolove()));
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
    const status = progress < 1 ? ['下载中'] : ['下载完成'];
    console.log('status: ', ...status);
    console.log(progress);
    const result = {
        progress,
        status
    };
    return result;
}

export function throttle(func, delay) {
    var timer = null;
    var startTime = Date.now();
    return function (...agrs) {
        var curTime = Date.now();
        var remaining = delay - (curTime - startTime);
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        if (remaining <= 0) {
            func.apply(context, args);
            startTime = Date.now();
        } else {
            timer = setTimeout(() => func(...agrs), remaining);
        }
    }
}


export async function downloader({ img, basePath, path: _path }, cb = (op) => { }) {
    return new Promise(async (reslove, reject) => {
        const down = await download({ url: img, path: path.join(basePath, _path) }, p => cb(calcProgress(p))).catch(error => (console.error(error), error));
        if (down instanceof Error) return reject({ type: 'download', error: down, url: img });
        reslove(down);
    });
}

export function getFilename(img) {
    if (!img) return '';
    let filename = img.split('/').slice(-1)[0] || 'null'
    if (filename.indexOf('?') > -1) {
        filename = filename.substr(0, filename.indexOf('?'))
    }
    return filename
}


export async function isGif(file) {
    const ret = await blobToString(file.slice(0, 6))
    const isgif = (ret === '47 49 46 38 39 61') || (ret === '47 49 46 38 37 61')
    return isgif

}

export async function isPng(file) {
    const ret = await blobToString(file.slice(0, 8))
    const ispng = ret === '89 50 4E 47 0D 0A 1A 0A'
    return ispng
}

export async function isJpg(file) {
    // jpg开头两个是 FF D8
    // 结尾两个是 FF D9
    const len = file.size
    const start = await blobToString(file.slice(0, 2))
    const tail = await blobToString(file.slice(-2, len))
    const isjpg = start === 'FF D8' && tail === 'FF D9'
    return isjpg
}

export function getImageType(file) {
    if (isPng(file)) {
        return '.png'
    }
    if (isJpg(file)) {
        return '.jpg'
    }
    if (isGif(file)) {
        return '.gif'
    }
    return null

}

// 二进制=> ascii码=> 转成16进制字符串
export async function blobToString(blob) {
    return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = function () {
            const ret = reader.result.split('')
                .map(v => v.charCodeAt())
                .map(v => v.toString(16).toUpperCase())
                .map(v => v.padStart(2, '0'))
                .join(' ')
            resolve(ret)
        }
        reader.readAsBinaryString(blob)
    })
}