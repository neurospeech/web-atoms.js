using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Routing;

namespace Atoms.Web.Module
{
    public class CachedRoute : HttpTaskAsyncHandler, IRouteHandler
    {

        private CachedRoute()
        {
            // only one per app..
            Enabled = true;
        }

        public static bool Enabled { get; set; }

        public static string CDNHost { get; set; }

        private string Prefix { get; set; }

        public static string Version { get; private set; }

        public static string CORSOrigins { get; set; }

        private TimeSpan MaxAge { get; set; }

        private static CachedRoute Instance;

        public static void Register(
            RouteCollection routes,
            TimeSpan? maxAge = null,
            string version = null)
        {
            CachedRoute sc = new CachedRoute();
            sc.MaxAge = maxAge == null ? TimeSpan.FromDays(30) : maxAge.Value;

            if (string.IsNullOrWhiteSpace(version))
            {
                version = System.Web.Configuration.WebConfigurationManager.AppSettings["Static-Content-Version"];
                if (string.IsNullOrWhiteSpace(version))
                {
                    version = Assembly.GetExecutingAssembly().GetName().Version.ToString();
                }
            }

            Version = version;

            var route = new Route("cached/{version}/{*name}", sc);
            route.Defaults = new RouteValueDictionary();
            route.Defaults["version"] = "1";
            routes.Add(route);
        }

        public override bool IsReusable
        {
            get
            {
                return true;
            }
        }

        public class CachedFileInfo
        {

            public string Version { get; set; }

            public string FilePath { get; set; }

            public CachedFileInfo(string path)
            {
                path = HttpContext.Current.Server.MapPath(path);

                FilePath = path;

                //Watch();

                Update(null, null);
            }

            private void Watch()
            {
                System.IO.FileSystemWatcher fs = new FileSystemWatcher(FilePath);
                fs.Changed += Update;
                fs.Deleted += Update;
                fs.NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.FileName;
            }

            private void Update(object sender, FileSystemEventArgs e)
            {
                FileInfo f = new FileInfo(FilePath);
                if (f.Exists)
                {
                    Version = f.LastWriteTimeUtc.ToString("yyyy-MM-dd-hh-mm-ss-FFFF");
                }
                else
                {
                    Version = "null";
                }
            }


        }

        private static ConcurrentDictionary<string, CachedFileInfo> CacheItems = new ConcurrentDictionary<string, CachedFileInfo>();

        public static HtmlString CachedUrl(string p)
        {
            //if (!Enabled)
            //    return new HtmlString(p);
            if (!p.StartsWith("/"))
                throw new InvalidOperationException("Please provide full path starting with /");

            string v = Version;

            var cv = CacheItems.GetOrAdd(p, k => new CachedFileInfo(k));
            v = cv.Version;

            if (CDNHost != null)
            {
                return new HtmlString("//" + CDNHost + "/cached/" + v + p);
            }
            return new HtmlString("/cached/" + v + p);
        }

        //[Obsolete("Replace with CachedUrl",true)]
        //public static HtmlString Url(string p)
        //{
        //    throw new InvalidOperationException();
        //}

        public override async System.Threading.Tasks.Task ProcessRequestAsync(HttpContext context)
        {
            var Response = context.Response;
            if (Enabled)
            {
                Response.Cache.SetCacheability(HttpCacheability.Public);
                Response.Cache.SetMaxAge(MaxAge);
                Response.Cache.SetExpires(DateTime.UtcNow.Add(MaxAge));
            }
            else
            {
                Response.Cache.SetCacheability(HttpCacheability.NoCache);
                Response.Cache.SetExpires(DateTime.UtcNow.AddDays(-10));
            }
            Response.BufferOutput = true;
            if (CORSOrigins != null)
            {
                Response.Headers.Add("Access-Control-Allow-Origin", CORSOrigins);
            }

            string FilePath = context.Items["FilePath"] as string;

            var file = new FileInfo(context.Server.MapPath("/" + FilePath));
            if (!file.Exists)
            {
                Response.StatusCode = 404;
                Response.StatusDescription = "Not Found by CachedRoute";
                Response.ContentType = "text/plain";
                Response.Output.Write("File not found by CachedRoute at " + file.FullName);
                return;

            }

            Response.ContentType = MimeMapping.GetMimeMapping(file.FullName);

            using (var fs = file.OpenRead())
            {
                await fs.CopyToAsync(Response.OutputStream);
            }
        }

        IHttpHandler IRouteHandler.GetHttpHandler(RequestContext requestContext)
        {
            //FilePath = requestContext.RouteData.GetRequiredString("name");
            requestContext.HttpContext.Items["FilePath"] = requestContext.RouteData.GetRequiredString("name");
            return (IHttpHandler)this;
        }
    }
}