using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace TodoApi.Models{
    public class LogUser{
        public string Name { get; set; }
        public string Operation { get; set; }
        public DateTime Date { get; set; }
}
}
