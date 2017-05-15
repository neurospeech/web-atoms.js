var $:any = {};

module Webatoms{

    class AtomEnumerator{

        private a:any[];
        private i: number = -1;

        constructor(a:any[]){
            this.a = a;
        }

        next():boolean{
            this.i++;
            return this.i < this.a.length;
        }

        current(): any{
            return this.a[this.i];
        }

        currentIndex(): number{
            return this.i;
        }
    }

    namespace Core{

        export class BindingMethod{
            element: Element;
            name: String;
            methodName: String;
            handler: Function;
            key:String = undefined;

        }

    }

    class AtomUI{
        static createDelegate(obj:any, methodName:String): Function{

        }

        static isNode(obj: any):boolean{
            return obj instanceof Element;
        }
    }

  
    

    class AtomComponent{

        

        __delegates: Core.BindingMethod[];

        constructor(){
            this.__delegates = [];
        }

        bindEvent(element:any, methodName: (Function | String), key: String, method: Function):void{
            if(element==null)
                return;
            var b:Core.BindingMethod = new Core.BindingMethod();
            b.element = element;
            if(typeof methodName == 'function'){
                method = methodName;
                b.methodName = undefined;
            }else{
                method = AtomUI.createDelegate(this, methodName);
                b.methodName = methodName;
            }
            b.handler = method;
            if(key){
                b.key = key;
            }

            this.__delegates.push(b);

            if(AtomUI.isNode(element)){
                $(element).bind(name,null,method);
            }else{
                if(element.addEventListener){
                    element.addEventListener(name,method,false);
                }else{
                    var f = element["add_" + name];
                }
            }

            
        }

    }

}