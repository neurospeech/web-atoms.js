using HtmlAgilityPack;
using NeuroSpeech.AtomsPreCompiler;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;

//Atoms.Web.Module.CachifyModule
namespace Atoms.Web.Module
{
    public class CachifyModule : IHttpModule
    {



        public void Dispose()
        {
            
        }

        public void Init(HttpApplication context)
        {
            context.BeginRequest += (s, e) => {
                context.Response.Filter = new CacheFilter(context.Response.Filter, context.Context);
            };
        }

        class CacheFilter : AtomPreCompilerFilterStream {

            private HttpContext context;

            public CacheFilter(Stream s, HttpContext c):base(s)
            {
                this.context = c;

                Uri root = context.Request.Url;
                RootUri = root;

                string basePath = "/";

                if (root.IsFile)
                {
                    basePath = string.Join("", root.Segments.Take(root.Segments.Length - 1));
                }
                else
                {
                    basePath = string.Join("", root.Segments);
                }

                UriBuilder rootBuilder = new UriBuilder(root.Scheme, root.Host, root.Port);
                rootBuilder.Path = basePath;

                BaseUri = rootBuilder.Uri;
            }

            public string ToAbsolute(string url) {
                if (string.IsNullOrWhiteSpace(url))
                    return RootUri.PathAndQuery;

                if (
                    url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                    url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    return url;

                if (url.StartsWith("/"))
                    return url;

                Uri n = new Uri(RootUri, url);

                return CachedRoute.CachedUrl(n.PathAndQuery).ToString();
            }

            public Uri RootUri { get; set; }

            public Uri BaseUri { get; set; }

            protected override byte[] ProcessBuffer(byte[] p)
            {
                try{

                    var cachify = context.Request.QueryString["cachify"];
                    if (cachify.EqualsIgnoreCase("no")) {
                        return p;
                    }

                Encoding e = context.Response.ContentEncoding;



                if (context.Response.ContentType.EqualsIgnoreCase("text/html")) {

                    string text = e.GetString(p);
                    HtmlDocument doc = new HtmlDocument();
                    doc.LoadHtml(text);

                    foreach (var item in doc.DocumentNode.Descendants())
                    {
                        ProcessTag(item, "img", "src");
                        ProcessTag(item, "script", "src");
                        ProcessTag(item, "link", "href");
                    }

                    doc.OptionWriteEmptyNodes = true;
                    

                    using (StringWriter ms = new StringWriter()) {
                        doc.Save(ms);
                        p = e.GetBytes(ms.GetStringBuilder().ToString());
                        
                    }

                    
                }

                    

                }catch(Exception ex){
                    return p;
                }
                return p;
            }

            private void ProcessTag(HtmlNode item, string tag, string att)
            {
                if (item.Name.EqualsIgnoreCase(tag))
                {
                    String src = item.GetAttributeValue(att, null);
                    if (src != null)
                    {
                        item.SetAttributeValue(att, ToAbsolute(src));
                        
                    }
                }
            }

        }
    }
}
