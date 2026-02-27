const fs = require('fs');
const path = require('path');

function walk(dir, ext, cb) {
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) walk(full, ext, cb);
        else if (full.endsWith(ext)) cb(full);
    }
}

// 1. Update .ts files
walk('F:/_Al-Saada_Smart_Bot/packages/core/src', '.ts', (fp) => {
    let content = fs.readFileSync(fp, 'utf8');
    let original = content;

    // Replace ctx.t('key_name') -> ctx.t('key-name')
    content = content.replace(/(ctx\.t\(['"])([a-z0-9_]+)(['"])/g, (m, p1, key, p3) => p1 + key.replace(/_/g, '-') + p3);

    // Replace formatGender returns
    content = content.replace(/gender_(unknown|male|female)/g, (m, p1) => 'gender-' + p1);

    // Replace fallback string returns like 'value_unknown' or 'user_inactive'
    content = content.replace(/(['"])(value_unknown|user_inactive)(['"])/g, (m, p1, p2, p3) => p1 + p2.replace(/_/g, '-') + p3);

    // Replace anywhere else that might be a literal translation key explicitly:
    content = content.replace(/(['"])(button_[a-z_]+|join_[a-z_]+|error_[a-z_]+|menu_[a-z_]+|status_[a-z_]+|notification_[a-z_]+|welcome_[a-z_]+)(['"])/g, (m, p1, key, p3) => p1 + key.replace(/_/g, '-') + p3);

    if (content !== original) {
        fs.writeFileSync(fp, content);
        console.log('Updated ' + fp);
    }
});

// 2. Update .ftl files
walk('F:/_Al-Saada_Smart_Bot/packages/core/src/locales', '.ftl', (fp) => {
    let content = fs.readFileSync(fp, 'utf8');
    let original = content;

    content = content.replace(/^([a-z0-9_]+)(\s*=)/gm, (m, key, eq) => key.replace(/_/g, '-') + eq);

    if (content !== original) {
        fs.writeFileSync(fp, content);
        console.log('Updated ' + fp);
    }
});
