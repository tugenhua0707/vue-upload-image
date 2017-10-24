/*
 * vue 实现图片上传
 */
Vue.component('tb-upload-image', {
  template: '#tb-upload-image',
  props: {
    // 容器的宽度
    width: {
      type: [Number, String],
      default: 600
    },
    // 上传图片的地址
    url: {
      type: String,
      default: ''
    },
    // 是否需要拖曳效果
    dragDrop: {
      type: Number,
      default: 1
    },
    // 页面默认需要显示的图片
    data: {
      type: Array
    },
    // 上传文件到服务器端fileName字段，默认为 imgFile
    fileName: {
      type: String,
      default: 'imgFile'
    },
    // 是否需要显示折叠按钮 1 就是显示，0 就是不显示
    fold: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      elemWidth: this.width,
      isDragDrop: this.dragDrop,
      initDatas: this.data || [],
      // 输入框隐藏域的值
      hiddenVal: '',
      // 上传文件保存后的数组
      fileFilter: [],
      // 监听 input[type=file]的值
      inputVal: '',
      // 该字段是重新渲染vue模板页面而设定的
      timeStamp: '',
      foldBtn: this.fold,
      isShrinkage: false
    }
  },
  beforeMount() {
    var self = this;
    var arrs = [];
    if (this.initDatas.length > 0) {
      this.initDatas.forEach((item, index) => {
        var imgUrl = item.url;
        arrs.push(imgUrl);
        var image = new Image();
        image.crossOrigin = '';
        image.src = imgUrl;
        (function(index, imgUrl, image){
          image.onload = function() {
            var base64 = self.getBase64Image(image);
            var blob = self.convertBase64UrlToBlob(base64);
            blob.successStatus = 1;
            blob.index = index;
            blob.name = imgUrl;
            blob.imgUrl = imgUrl;
            blob.newUrl = imgUrl;
            blob.isclickUploadBtn = false;
            self.fileFilter.push(blob);
          }
        })(index, imgUrl, image);
      });
      this.hiddenVal = arrs.join('|');
    }
  },
  mounted() {
    console.log(this.fileFilter)
  },
  methods: {
    getBase64Image(img) {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      var ext = img.src.substring(img.src.lastIndexOf(".")+1).toLowerCase();
      var dataURL = canvas.toDataURL("image/"+ext);
      return {
        dataURL: dataURL,
        type: "image/"+ext
      };
    },
    /**  
     * 将以base64的图片url数据转换为Blob  
     * @param urlData  
     * 用url方式表示的base64图片数据  
     */ 
    convertBase64UrlToBlob(base64) {
      var urlData =  base64.dataURL;
      var type = base64.type;
      var bytes = window.atob(urlData.split(',')[1]); //去掉url的头，并转换为byte
      //处理异常,将ascii码小于0的转换为大于0  
      var ab = new ArrayBuffer(bytes.length);  
      var ia = new Uint8Array(ab);  
      for (var i = 0; i < bytes.length; i++) {  
        ia[i] = bytes.charCodeAt(i);  
      }  
      return new Blob( [ab] , {type : type});  
    },
    typeOf: function(obj) {
      const toString = Object.prototype.toString;
      const map = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object'
      };
      return map[toString.call(obj)];
    },
    // 深度克隆对象
    deepCopy(data) {
      const t = this.typeOf(data);
      let o,
        i;
      if (t === 'array') {
        o = [];
      } else if (t === 'object') {
        o = {};
      } else {
        return data;
      }
      if (t === 'array') {
        for (let i = 0; i < data.length; i++) {
          o.push(this.deepCopy(data[i]));
        }
      } else if (t === 'object') {
        for (i in data) {
          o[i] = this.deepCopy(data[i]);
        }
      }
      return o;
    },
    // 选择文件组的过滤方法 返回所有过滤后的文件
    filter(files) {
      var arrFiles = [];
      for (var i = 0, file; file = files[i]; i++) {
        if (file.size >= 1024000) {
          alert('您这张'+ file.name + '图片过大，应小于1M');
        } else {
          arrFiles.push(file);
        }
      }
      return arrFiles;
    },
    dragHover(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    getFiles(e) {
      // 文件选择或拖动 需要调用该方法 同时阻止浏览器默认操作(打开该图片操作)
      this.dragHover(e);

      // 获取被选择的文件对象列表
      var files = e.target.files || e.dataTransfer.files;
      // 继续添加文件 调用filter方法
      var files = this.filter(files);
      // 深度克隆对象
      this.newFiles = this.deepCopy(this.fileFilter);
      this.newFiles = this.newFiles.concat(files);

      // 选择文件的处理
      this.dealFiles();

      return this;
    },
    // 选择文件的处理
    dealFiles() {
      var files = this.newFiles;
      if (files.length) {
        for(var i = 0, ilen = files.length; i < ilen; i++) {
          // 索引值
          this.newFiles[i].index = i;
          this.newFiles[i].isclickUploadBtn = false;
        }
        // 执行选择回调
        this.onSelect(this.newFiles);
        return this;
      }
    },
    onSelect(files) {
      var self = this;
      var i = 0;
      var funAppendImage = function() {
        var file = files[i];
        if (file) {
          if (!file.successStatus) {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function(e) {
              file.imgUrl = e.target.result;
              i++;
              funAppendImage();
            }
          } else {
            i++;
            funAppendImage();
          }
        } else {
          self.fileFilter = self.deepCopy(self.newFiles);
        }
      };
      funAppendImage();
    },
    uploadFiles() {
      var self = this;
      if (self.fileFilter.length) {
        for(var i = 0, ilen = self.fileFilter.length; i < ilen; i++) {
          var file = self.fileFilter[i];
          if (!file.successStatus) {
            self.$set(self.fileFilter[i], 'isclickUploadBtn', true);

            // 重新渲染模板
            self.timeStamp = (new Date()).getTime();

            var formdata = new FormData();
            // 上传到服务器的字段名称
            formdata.append(self.fileName, file);
            (function(file){
              // 模拟数据如下：
              setTimeout(function(){
                var newUrl = 'xxxxx';
                file.successStatus = 1;
                file.isclickUploadBtn = false;
                file.newUrl = newUrl;

                var inputValue = self.hiddenVal;
                if (inputValue) {
                  inputValue = inputValue + "|" + newUrl;
                } else {
                  inputValue = newUrl;
                }
                self.hiddenVal = inputValue;
              }, 3000);
            })(file);
          }
        }
      }
    },
    indexOf: function(index, arrs){
      if (arrs.length) {
        for (var i = 0, ilen = arrs.length; i < ilen; i++) {
          if (arrs[i].index == index) {
            return i;
          }
        }
      }
      return -1;
    },
    deleteItem(index) {
      this.inputVal = '';
      var hiddenValues = [];
      var index = this.indexOf(index, this.newFiles);
      if (index !== -1) {
        this.fileFilter.splice(index, 1);
      }
      if (this.fileFilter.length) {
        for (var j = 0, jlen = this.fileFilter.length; j < jlen; j++) {
          // 判断是否已经上传了
          if (this.fileFilter[j].successStatus) {
            var url = this.fileFilter[j].newUrl ? this.fileFilter[j].newUrl : '';
            hiddenValues.push(url);
          }
        }
      }
      if (hiddenValues.length >= 2) {
        this.hiddenVal = hiddenValues.join(',').replace(/,/g, '|');
      } else {
        this.hiddenVal = hiddenValues.join(',');
      }
    },
    foldFunc() {
      if (!this.isShrinkage) {
        this.isShrinkage = true;
      } else {
        this.isShrinkage = false;
      }
    }
  }
});
