using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
        [Table("lists", Schema = "todoapp")]
        public class List
        {
            public int Id { get; set; }
            public DateTime Date { get; set; }

        }
}
