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
  cd "$srcdir/$pkgver"

  npm ci
  npm run build

  # Install your program
  npm ci --production --prefix "$pkgdir/usr/lib/$pkgname"

  # Create symlink to the executable
  install -Dm755 -T "$pkgdir/usr/lib/$pkgname/dist/main.js" "$pkgdir/usr/bin/pulse-midi"

  install -Dm644 ./pulse-midi.service "$pkgdir/usr/lib/systemd/user/pulse-midi.service"
}
