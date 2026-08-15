# OSS 上传目录

这个目录是给阿里云 OSS 用的站点包。
不要手改这里的网页文件。
每次发布前先构建，再把这里的内容同步到桶根目录。

```bash
npm run build
```

成功后，把 `upload/` **里面的文件** 上传到 OSS 根目录。
不要把 `upload` 这一层文件夹本身当成站点根路径。

应该出现在桶根目录的内容包括：

- `index.html`
- `2026/`
- `2025/`
- `_assets/`
- `brand/`
- `favicon.png` / `favicon.svg`
- `robots.txt` / `sitemap.xml`
- `404.html`

不要上传仓库根目录、`src/`、`public/`、`node_modules/` 或本地 `output/`。

OSS 静态网站建议：

- 默认首页：`index.html`
- 404 页面：`404.html`
- HTML 用短缓存
- `_assets/` 可以用长缓存

2025 幻灯片不在这个目录里。
如果归档下载需要上线，另外传到 `/2025/assets/slides/`。
