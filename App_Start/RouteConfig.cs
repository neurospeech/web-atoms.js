using Atoms.Web.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Routing;

namespace Atoms.Web
{
    class RouteConfig
    {
        internal static void RegisterRoutes(RouteCollection routes)
        {


            CachedRoute.Register(routes);

            string cdn = System.Web.Configuration.WebConfigurationManager.AppSettings["CDNHost"];
            if (!string.IsNullOrWhiteSpace(cdn)) {
                CachedRoute.CDNHost = cdn;
                CachedRoute.CORSOrigins = "*";
            }
        }
    }
}
