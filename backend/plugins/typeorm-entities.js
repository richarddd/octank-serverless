const fs = require("fs");
const path = require("path");

const nodeModules = new RegExp(/^(?:.*[\\\/])?node_modules(?:[\\\/].*)?$/);

const typeormPlugin = {
  name: "typeorm",

  setup(build) {
    build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
      if (!filePath.match(nodeModules)) {
        console.log(filePath);
        let contents = fs.readFileSync(filePath, "utf8");
        const loader = path.extname(filePath).substring(1);
        if (contents.includes("__TYPEORM_ENTITIES")) {
          console.log("filePath has __TYPEORM_ENTITIES", filePath);
        }
        // if (contents.includes("@Entity(")) {
        //   console.log("filePath has entity", filePath);
        // } else if (contents.includes("__TYPEORM_ENTITIES")) {
        //   console.log("filePath has __TYPEORM_ENTITIES", filePath);
        //   contents.replace("__TYPEORM_ENTITIES", "[]");
        // }
        // const dirname = path.dirname(filePath);
        // contents = contents
        //   .replace("__dirname", `"${dirname}"`)
        //   .replace("__filename", `"${filePath}"`);
        return {
          contents,
          loader,
        };
      }
    });
  },
};

exports.default = typeormPlugin;
