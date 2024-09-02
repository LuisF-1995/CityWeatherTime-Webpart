import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Environment, EnvironmentType } from '@microsoft/sp-core-library';
import {
    Web,
    setup,
    Site
} from 'sp-pnp-js';
import { CurrentUser } from "sp-pnp-js/lib/sharepoint/siteusers";

export class PNP {
    public context: WebPartContext;
    public siteRelativeUrl: string;
    public web: Web;
    public site: Site;
    public sp:any;

    constructor(context: WebPartContext) {
        this.context = context;
        this.siteRelativeUrl = context.pageContext.web.serverRelativeUrl;
        this.sp = spfi().using(SPFx(this.context));
        
        if (Environment.type === EnvironmentType.SharePoint) {
            setup({ spfxContext: this.context });
            this.web = new Web(this.context.pageContext.web.absoluteUrl);
            this.site = new Site(this.context.pageContext.web.absoluteUrl);
        }
    }

    public getListItems(
        listName: string,
        fields: string[],
        filters: string,
        expand: string,
        sortid?: any,
        topItem?: number
    ): Promise<any[]> {
        const top = topItem ? topItem : 9999;
        const sort = sortid ? sortid : {property : "ID", asc:true};
        return new Promise((resolve, reject) => {
            let list = this.web.lists.getByTitle(listName);
            if (list) {
                list.items
                    .filter(filters)
                    .select(...fields)
                    .expand(expand)
                    .orderBy(sort.property, sort.asc)
                    .top(top)
                    .get()
                .then((items: any[]) => {
                    resolve(items);
                })
                .catch(() => {
                    reject(null);
                });
            }
        });
    }

    public async getCurrentUser(): Promise<CurrentUser> {
        const user = await this.web.currentUser.get();
        return user;
    }

    public insertItem(
        listName: string,
        properties: any,
        attachment?: any
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            let list = this.web.lists.getByTitle(listName);
            list.items
            .add(properties)
            .then((res: { item: { attachmentFiles: { add: (arg0: any, arg1: any) => Promise<any>; }; }; data: any; }) => {
                if (attachment) {
                    res.item.attachmentFiles
                    .add(attachment.name, attachment)
                    .then((_: any) => {
                        resolve(res.data);
                    })
                    .catch(error => console.error(error));
                }
                else {
                    resolve(res.data);
                }
            })
            .catch((err: any) => {
                reject(err);
            });
        });
    }

    public updateById(
        listname: string,
        id: number,
        properties: any,
        attachment?: any,
        attachmentName?: string
    ): Promise<any> {
        let list = this.web.lists.getByTitle(listname);
        return list.items
        .getById(id)
        .update(properties)
        .then((res: { item: any; }) => {
            if(attachment !== undefined) {
                this.insertAttachments(res.item, 0, attachment[0], attachment, function(){
                    return res
                })
            }
            else
                return res
        });
    }

    public deleteItem(listName: string, id: number): Promise<any> {
        let list = this.web.lists.getByTitle(listName);
        return list.items.getById(id).delete();
    }

    public insertAttachments(item: { attachmentFiles: { add: (arg0: string, arg1: File) => Promise<any>; }; }, pos: number, fileItem:any, attachmentArray:any, functionsuccess: { (item: any): void; (): any; (arg0: any): void; }){
        if(fileItem!=undefined){
          let file: File=fileItem.file;
  
          item.attachmentFiles
          .add(file.name, file)
          .then((att: any) => {
            if(pos< attachmentArray.length-1){
              this.insertAttachments(item, pos+1, attachmentArray[pos+1], attachmentArray, functionsuccess)
            }
            else if(pos == attachmentArray.length-1){
              functionsuccess(item)
            }
            //resolve(att);
          })
          .catch(error => console.error(error));
        }
        else{
            functionsuccess(item);
        }
    }
}