set -e

mongo <<EOF
use $DB_NAME

db.createUser({
  user: '$DB_USER',
  pwd: '$DB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$DB_NAME'
  }]
})
EOF