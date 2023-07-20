const fs = require('fs');
const path = require('path');

const error = (msg) => {
  console.error(msg);
  process.exit(1);
}

const packagePath = path.join(__dirname, '..', 'package.json');
const packageBakPath = packagePath + '.bak';

const type = process.argv[2];
if (type === 'prepublish') {
  if (fs.existsSync(packageBakPath)) {
    fs.copyFileSync(packageBakPath, packagePath);
    fs.unlinkSync(packageBakPath);
  }
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  delete packageJson.workspaces;
  fs.copyFileSync(packagePath, './package.json.bak');
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
} else if (type === 'postpublish') {
  if (!fs.existsSync(packageBakPath)) {
    error('package.json.bak not found')
  }
  fs.copyFileSync(packageBakPath, packagePath);
  fs.unlinkSync(packageBakPath);
} else {
  error(`invalid type: ${type}. Expected 'prepublish' or 'postpublish'.`);
}
