import http from "http";
import https from "https";
import fs from "fs";
import formidable from "formidable";

const host : string = "localhost";
const port : number = 8888;
const savedFilesFolder : string = "/home/danziel/Work/NodeJs/AutoSite/Files/" ;
const delimiter = ";";

const handleFileUpload = (req: any, res:any) => {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      const filepath = JSON.parse(JSON.stringify({files }, null, 2)).files.filetoupload.filepath;
      const filename = JSON.parse(JSON.stringify({files }, null, 2)).files.filetoupload.originalFilename;
      const newPath = savedFilesFolder + filename;
      fs.copyFile(filepath, newPath, function (err) {
        if (err) throw err;
        res.write('File uploaded and moved!');
        res.end();
      });
      res.write(filepath);
      res.end();
    });

}

const readCvs = (filePath : string) : Promise<{data:string}> =>{

    return new Promise((resolve, reject) => {
        fs.readFile(filePath,"utf-8", (err: any, data:any) => {
            if(err) return reject(err)
            return resolve({data : data})
        });
    });

}

const getListOfCsvs = () : Promise<{data:string[]}> =>{

    return new Promise((resolve, reject) =>{
    fs.readdir(savedFilesFolder,(err:any, data:any)=>{

        if(err) return reject(err)

        let csvFiles : string[] = [];

        for(const file of data)
            if(file.includes(".csv"))
                csvFiles.push(file)
        resolve({data : csvFiles})
        });
    })
}

const convertCsvToJson = (csvData : string) : string[] =>{
    let lines : string[] = csvData.split("\n");
    let headers : string[] = lines[0].split(delimiter);
    let result : string[] = [];

    for(let i=1;i<lines.length;i++){

        let obj :any = {};
        let currentline=lines[i].split(delimiter);
    
        for(let j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }

        result.push(obj);
    }

    return result;
    
}

const displayList = (req:any, res:any) => {
    getListOfCsvs()
        .then(({data}) => {
            for(const file of data)
                res.write(`<a href="/list/${file}">${file}</a> \n`)
        })
        .catch(err => {throw err})
        .finally(() => {
            res.end();
        })
}



const handleJsonUrl = (req : any, res :any) => {

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>'); 

}

const urlParser = (req:any, res:any) => {
    const url = req.url;
    if(url.includes("/list/")){
       const slicedUrl = url.split("/"); 
       const selectedFileName = slicedUrl[2]
       const pathToSelectedFile = savedFilesFolder + selectedFileName;
       readCvs(pathToSelectedFile)
        .catch((err) => {throw err})
        .then(({data}) => {
            for(const entry of convertCsvToJson(data))
                res.write(JSON.stringify(entry))
        })
        .finally(() => res.end())
       
       
    }

    if (url === "/getFromApi"){
        https.get('https://random-data-api.com/api/v2/users', (res)=>{
            let data = "";
            res.on('data', (chunck) =>{
                data += chunck;
                })

            res.on('end', () => {
                fs.writeFile(savedFilesFolder + "saved.json", data,(err) => {throw err})
            });
        })
        res.end("File saved")
    }
    if (url === "/Json")
        return handleJsonUrl(req, res);
    if (url === "/fileupload")
        return handleFileUpload(req, res);
    if (url === "/listFiles")
        return displayList(req,res);
    if (url === "/html")
        return fs.readFile('/home/danziel/Work/NodeJs/AutoSite/static/index.html', (err, html) => {
            if(err) throw err;
        res.writeHeader(200, {"Content-Type": "text/html"});  
        res.write(html);  
        return res.end();  
});
}

const listener = (req:any, res:any) => {
    urlParser(req,res);
}

const server = http.createServer(listener)

console.log(`Listing on port: ${port} on host: ${host}`)
console.log(`Click to access: http://${host}:${port}`)
server.listen(port)
