pkgname=pulse-midi
pkgver=0.0.1
pkgrel=1
pkgdesc="USB Midi Controller for Pulse Audio"
arch=('any')
url="https://github.com/johnshaughnessy/pulse-midi"
license=('MIT')
depends=('nodejs')
source=("git+https://github.com/johnshaughnessy/pulse-midi")
sha256sums=('SKIP')
install=pulse-midi.install
package() {
  cd "$srcdir/$pkgname"

  npm ci
  npm run build

  install -Dm644 "$srcdir/pulse-midi/package-lock.json" "$pkgdir/usr/lib/$pkgname/package-lock.json"
  install -Dm644 "$srcdir/pulse-midi/package.json" "$pkgdir/usr/lib/$pkgname/package.json"

  npm ci --production --omit=dev --prefix "$pkgdir/usr/lib/$pkgname"

  install -d "$pkgdir/usr/lib/$pkgname/dist"
  cp -r "$srcdir/$pkgname/dist" "$pkgdir/usr/lib/$pkgname/"

  install -Dm755 -T "$srcdir/$pkgname/pulse-midi" "$pkgdir/usr/bin/pulse-midi"
  install -Dm644 ./pulse-midi.service "$pkgdir/usr/lib/systemd/user/pulse-midi.service"
}
