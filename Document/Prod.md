Как разворачивать продакшен (Ubuntu + Nginx):

Сборка проекта
На локальной машине или на сервере:
Node 18+ и npm.
Установите зависимости:
npm ci (или npm install)
Сборка:
npm run build
Проверка локально (опционально):
npm run preview
Копируйте папку dist на сервер
Результат сборки — это статические файлы в dist.
Скопируйте содержимое dist на сервер в, например, /var/www/podkova-sadki.
Установка и настройка Nginx
Установите nginx (если нет): sudo apt update && sudo apt install -y nginx

Создайте конфиг сайта, например /etc/nginx/sites-available/podkova-sadki:

server*name ваш*домен_или_IP;

root /var/www/podkova-sadki;

index index.html;

location / { try_files $uri $uri/ /index.html; }

location ~\* .(js|css|png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|woff2?)$ { expires 1y; add_header Cache-Control "public, immutable"; try_files $uri =404; }

location = index.html { expires -1; add_header Cache-Control "no-cache"; }

Активируйте сайт:

sudo ln -s /etc/nginx/sites-available/podkova-sadki /etc/nginx/sites-enabled/podkova-sadki
sudo nginx -t
sudo systemctl reload nginx
HTTPS (Let’s Encrypt)
Установите certbot: sudo apt install -y certbot python3-certbot-nginx
Выдайте сертификат: sudo certbot --nginx -d ваш_домен
Автопродление ставится автоматически.
Обновления релиза
Пересобираете локально: npm run build
Копируете новый dist на сервер в /var/www/podkova-sadki (через scp/rsync).
Nginx перезагружать не нужно — это статика.
Доп. настройки:

Базовый путь (если сайт не на корне домена):
В vite.config.js задайте base: '/подпуть/'.
Видео и public:
Всё из public доступно по корню. Ваше видео — /media/preview.mp4.
Для постера можно добавить статичную картинку в public.
Доступ к dev-серверу с телефона/другого ПК:
npm run dev:lan
Откройте Network URL, который покажет Vite (например, http://192.168.x.y:5173).

scp -r /home/ninja/sites/podkova-sadki/dist ninjamax1917@10.10.0.101:~/sites/podkova-sadki/

Делаем превьюху
ffmpeg -i /home/ninja/sites/podkova-sadki/public/media/preview.mp4 -vf "select=eq(n\,0)" -q:v 1 /home/ninja/sites/podkova-sadki/public/media/preview-frame.jpg
