// 从 .env 读取 APPID，并据此生成被 git 忽略的 project.config.json
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function loadEnv(file) {
    if (!fs.existsSync(file)) {
        return {};
    }
    const env = {};
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const index = trimmed.indexOf('=');
        if (index === -1) {
            continue;
        }
        env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
    }
    return env;
}

const { APPID } = loadEnv(path.join(root, '.env'));
if (!APPID) {
    console.error('缺少 APPID：请复制 .env.example 为 .env 并设置 APPID=你的小程序AppID');
    process.exit(1);
}

const templatePath = path.join(root, 'project.config.example.json');
const template = fs.readFileSync(templatePath, 'utf8');
fs.writeFileSync(
    path.join(root, 'project.config.json'),
    template.replace(/__APPID__/g, APPID)
);
console.log('已生成 project.config.json（appid: ' + APPID + '）');
