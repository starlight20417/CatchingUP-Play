'use strict';
/*
* 小型游戏引擎
*/
function Game(id,options){
	var _ = this;
	options = options||{};
	var settings = {
		width:960,						//画布宽度
		height:640						//画布高度
	};
	for(var i in settings){
		this[i] = options[i]||settings[i];
	}
	var $canvas = document.getElementById(id);
	$canvas.width = _.width;
	$canvas.height = _.height;
	var _context = $canvas.getContext('2d');	//画布上下文环境
	var _stages = [];							//布景对象队列
	var _events = {};							//事件集合
	var _index,									//当前布景索引					
		_hander;  								//帧动画控制
	//活动对象构造
	var Item = function(options){
		options = options||{};
		var settings = {
			x:0,					//横坐标
			y:0,					//纵坐标
			width:20,				//宽
			height:20,				//高
			type:0,					//对象类型,0表示普通对象(不与地图绑定),1表示玩家控制对象,2表示程序控制对象
			status:1,				//对象状态,1表示正常,0表示隐藏
			orientation:0,			//当前定位方向,0表示上,1表示右,2表示下,3表示左
			vector:{},				//目标坐标
			coord:{},				//如果对象与地图绑定,获得坐标值
			speed:1,				//速度等级,内部计算器times多少帧变化一次
			control:{},				//控制缓存,到达定位点时处理
			path:[],				//NPC自动行走的路径
			index:0,				//对象索引
			stage:null,				//绑定对象与所属布景绑定
			update:function(){}, 	//更新参数信息
			draw:function(){}		//绘制
		};
		for(var i in settings){
			this[i] = options[i]||settings[i];
		}
	};
	Item.prototype.bind = function(eventType,callback){
		if(!_events[eventType]){
			_events[eventType] = {};
			$canvas.addEventListener(eventType,function(e){
				var position = _.getPosition(e);
				_stages[_index].items.forEach(function(item){
					if(Math.abs(position.x-item.x)<item.width/2&&Math.abs(position.y-item.y)<item.height/2){
						var key = 's'+_index+'i'+item.index;
						if(_events[eventType][key]){
							_events[eventType][key](e);
						}
					}
				});
				e.preventDefault(); 
			});
		}
		_events[eventType]['s'+this.stage.index+'i'+this.index] = callback.bind(this);  //绑定作用域
	};
	//地图对象构造器
	var Map = function(options){
		options = options||{};
		var settings = {
			x:0,						//地图起点坐标
			y:0,		
			size:20,					//地图单元的宽度
			data:[],					//地图数据
			stage:null,					//布景
			x_length:0,					//二维数组x轴长度
			y_length:0,					//二维数组y轴长度
			update:function(){},		//更新地图数据
			draw:function(){},			//绘制地图
		};
		for(var i in settings){
			this[i] = options[i]||settings[i];
		}
	};
	//获取地图上某点的值
	Map.prototype.get = function(x,y){
		if(this.data[y]&&typeof this.data[y][x]!='undefined'){
			return this.data[y][x];
		}
		return -1;
	};
	//地图坐标转画布坐标
	Map.prototype.coord2position = function(cx,cy){
		return {
			x:this.x+cx*this.size+this.size/2,
			y:this.y+cy*this.size+this.size/2
		};
	};
	//画布坐标转地图坐标
	Map.prototype.position2coord = function(x,y){
		var fx = (x-this.x)%this.size-this.size/2;
		var fy = (y-this.y)%this.size-this.size/2;
		return {
			x:Math.floor((x-this.x)/this.size),
			y:Math.floor((y-this.y)/this.size),
			offset:Math.sqrt(fx*fx+fy*fy)
		};
	};
	//寻址算法
	Map.prototype.finder = function(param){
		var defaults = {
			map:this.data,
			start:[0,0],
			end:[0,0]
		};
		var options = (function(target, params) {
		   for (var prop in params) {  
				target[prop] = params[prop];
		   }      
		   return target;
		})(defaults,param);
		var result = [];
		if(options.map[options.start[0]][options.start[1]]||options.map[options.end[0]][options.end[1]]){ //当起点或终点设置在墙上
			return [];
		}
		var finded = false;
		var length_x  = options.map.length;
		var steps = new Array(length_x); //步骤的映射
		for(var x=length_x;x--;){
			var length_y = options.map[x].length;
			steps[x] = new Array(length_y);
			for(var y=length_y;y--;){
				steps[x][y] = 0;
			}
		}
		var _render = function(list){
			var new_list = [];
			var next = function(from,to){
				var x = to[0],y = to[1];
				if(typeof steps[x]!= 'undefined'&&typeof steps[x][y] != 'undefined'&&!options.map[x][y]&&!finded){	//当前点是否可以走
					if(x==options.end[0]&&y==options.end[1]){
						steps[x][y] = from;
						finded = true;
					}else if(!steps[x][y]){
						steps[x][y] = from;
						new_list.push(to);
					}
				}
			};				
			for(var i=0,len=list.length;i<len;i++){
				var current = list[i];
				var x = current[0],y=current[1];
				next(current,[x+1,y]);
				next(current,[x,y+1]);
				next(current,[x-1,y]);
				next(current,[x,y-1]);
			}
			if(!finded&&new_list.length){
				_render(new_list);
			}
		};
		_render([options.start]);
		if(finded){
			var current=options.end;
			while(current[0]!=options.start[0]||current[1]!=options.start[1]){
				result.unshift(current);
				current=steps[current[0]][current[1]];
			}
		}
		return result;
	};
	//布景对象构造器
	var Stage = function(options){
		options = options||{};
		var settings = {
			status:1,						//布景状态,1表示正常,0表示非活动
			map:null,						//布景地图对象
			audio:[],						//音频资源
			images:[],						//图片资源
			items:[]						//对象队列
		};
		for(var i in settings){
			this[i] = options[i]||settings[i];
		}
	}
	//动画开始
	Stage.prototype.start = function() {
		var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||window.mozRequestAnimationFrame ||window.msRequestAnimationFrame;
		var f = 0;		//帧数计算
		var stage = this;
		var fn = function(){
			_context.clearRect(0,0,_.width,_.height);		//清除画布
			f++;
			if(stage.map){
				stage.map.update();
				stage.map.draw(_context);
			}			
			if(stage.items.length){
				stage.items.forEach(function(item,index){
					if(stage.status!=2&&item.status!=2){  	//对象及布景状态不为暂停
						if(!(f%item.speed)){
							item.frames = f/item.speed;		//计数器
						}
						if(stage.map&&item.type){
							item.coord = stage.map.position2coord(item.x,item.y);
						}
						item.update();
					}
					item.draw(_context);
				});
			}
			_hander = requestAnimationFrame(fn);
		};
		this.stop();
		_hander = requestAnimationFrame(fn);
	};
	//动画结束
	Stage.prototype.stop = function(){
		var cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame ||window.msCancelAnimationFrame;
		_hander&&cancelAnimationFrame(_hander);
	};
	//添加对象
	Stage.prototype.createItem = function(options){
		var item = new Item(options);
		//动态属性
		item.stage = this;
		item.index = this.items.length;
		this.items.push(item);
		return item;
	};
	//添加地图
	Stage.prototype.createMap = function(options){
		var map = new Map(options);
		//动态属性
		this.map = map;
		map.stage = this;
		map.y_length = map.data.length;
		map.x_length = map.data[0].length;
		return map;
	};
	//绑定事件
	Stage.prototype.bind = function(eventType,callback){
		if(!_events[eventType]){
			_events[eventType] = {};
			window.addEventListener(eventType,function(e){
				var key = 's' + _index;
				if(_events[eventType][key]){
					_events[eventType][key](e);
				}
				e.preventDefault(); 
			});
		}
		_events[eventType]['s'+this.index] = callback.bind(this);	//绑定事件作用域
	};
	//事件坐标
	this.getPosition = function(e){
		var box = $canvas.getBoundingClientRect();
		return {
			x:e.clientX-box.left*(_.width/box.width),
			y:e.clientY-box.top*(_.height/box.height)
		};
	}
	//创建布景
	this.createStage = function(options){
		var stage = new Stage(options);
		stage.index = _stages.length;
		_stages.push(stage);
		return stage;
	};
	//下个布景
	this.nextStage = function(){
		if(_index<_stages.length-1){
			_stages[_index] = 0;
			_index++;
			_stages[_index].start();
		}else{
			throw new Error('unfound new stage.');
		}
	};
	//初始化游戏引擎
	this.init = function(){
		_index = 0;
		if(_stages[_index]){
			_stages[_index].start();
		}
	};
}