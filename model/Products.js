class Product {
  constructor(rowNumber, barcode, description, count) {
    this.rowNumber = rowNumber
    this.barcode = barcode
    this.description = description
    this.count = count
    this.forSearching = (barcode + " " + description).toLowerCase()
  }
}

var Products = {
  array: [],
  wb: undefined,
  
  loadFromExcel: function(excelFile) {    
    this.wb = new ExcelJS.Workbook()
    let reader = new FileReader()

    reader.readAsArrayBuffer(excelFile)
    reader.onload = () => {
      const buffer = reader.result
      this.wb.xlsx.load(buffer).then(workbook => {
        this.array = []
        console.log(workbook)
        console.log("Excel file loaded!")
        
        const ws = this.wb.worksheets[0]
        ws.eachRow((row, rowNumber) => {
          // En el archivo de Excel, las columnas de Codigo, Descripcion y Conteo son A, B y C

          // Conteos a cero
          if (row.getCell(1).value && row.getCell(1).value!=="ARTICULO" && !row.getCell(1).value.startsWith("Lista de precios")) {
            row.getCell(3).value = 0
            row.commit()  
          }
          // End - Conteos a cero
          
          this.array.push(new Product(rowNumber, row.getCell(1).value, row.getCell(2).value, row.getCell(3).value))
        })
        localStorage.setItem("OlyInven-ProductsArray", JSON.stringify(this.array))
      })
      .catch(error => {
        alert("No se puede leer el archivo de Excel")
      })
    }
  },
  
  writeToExcel: function(filename="export.xlsx") {
    if (localStorage.getItem("OlyInven-File") == undefined) {
      //alert ("No se cargó el archivo de excel")
      //return
    }
    
    // Activar la siguiente parte solo si se desea que el Excel final
    // solo contenga los productos que se contaron.
    // Desactivar si se desea que los productos que no se contaron
    // queden en cero
    /*
    let ws = this.wb.worksheets[0]
    let lastRow = ws.lastRow._number
    while (lastRow > 1) {
      if (ws.getRow(lastRow).getCell(3).value == 0) {
        ws.spliceRows(lastRow, 1)  
      }
      
      lastRow--
    }
    */
    
    // 1-oct-2022
    // Activar la siguiete parte solo si se desea regresar a la funcionalidad anterior,
    // que se use el archivo que se leyó previamente como base para el nuevo archivo de Excel
    /*
    this.wb.xlsx.writeBuffer().then(function (data) {
      let blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
      downloadBlob(blob, filename);
    })*/
    
    // Nueva funcionalidad: crear un archivo de Excel nuevo para descargar.
    // Esto permitirá que se puedan guardar en localStorage los datos entre sesiones
    let wb = new ExcelJS.Workbook()
    let ws = wb.addWorksheet("Sheet1")
    
    Products.array.forEach(function (row) {
      ws.addRow([row.barcode, row.description, Number.isNaN(row.count) ? 0 : row.count])
    })
    
    wb.xlsx.writeBuffer().then(function (data) {
      let blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
      downloadBlob(blob, filename);
    })
    
    // Cleaning up
    this.array =[]
    this.wb = undefined
    localStorage.removeItem("OlyInven-File")
    localStorage.removeItem("OlyInven-ProductsArray")
  },
  
  findByBarcode: function(barcode) {
    return this.array.find(i => i.barcode == barcode)
  },
  
  search: function(string) {
    return this.array.filter(i => i.forSearching.indexOf(string) >= 0)
  }
}